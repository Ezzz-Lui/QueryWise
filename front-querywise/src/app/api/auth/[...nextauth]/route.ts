import { processEnv } from "@next/env";
import NextAuth, { NextAuthOptions} from "next-auth";
import AzureAD from "next-auth/providers/azure-ad";
import { cookies } from "next/headers";


declare module "next-auth"{
    interface Session {
        accessToken?:   string;
        idToken?:       string;
    }
}

declare module "next-auth/jwt"{
    interface JWT {
        provider?:      string;
        accessToken?:   string;
        idToken?:       string;
    }
}

const authOptions: NextAuthOptions = {
    providers: [
        AzureAD({
            clientId: process.env.AZURE_AD_CLIENT_ID as string,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
            tenantId: process.env.AZURE_AD_TENANT_ID as string,
            authorization: { params: { scope: "openid profile user.Read email"} },
        }),
    ],

    secret: process.env.NEXTAUTH_SECRET as string,
    callbacks: {
        async jwt( { token , account, profile } ) {
            if ( account ) {
                token.idToken = account?.id_token as string;
                token.accessToken = account?.access_token as string;
            }
            if (profile) {
                token.name = profile.name;
                token.email = profile.email
            }
            return token;
        },
        async session ( { session, token} ) {
            session.accessToken = token.accessToken as string;
            session.idToken = token.idToken as string;

            if (session.user) {
                session.user.name = token.name;
                session.user.email = token.email;
            }

            (await cookies()).set('idToken', session.idToken);
            return session
        },
    },
};


const handler = NextAuth(authOptions);
export { handler as GET, handler as POST}