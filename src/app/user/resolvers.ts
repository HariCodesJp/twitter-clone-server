import axios from "axios";
import { prismaClient } from "../../client/db";
import JWTService from "../../services/jwt";

interface GoogleTokenResult {
  iss?: String;
  azp?: String;
  aud?: String;
  sub?: String;
  email: String;
  email_verified: String;
  nbf?: String;
  name?: String;
  picture?: String;
  given_name: String;
  family_name?: String;
  iat?: String;
  exp?: String;
  jti?: String;
  alg?: String;
  kid?: String;
  typ?: String;
}

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: String }) => {
    const googleToken = token;
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", googleToken.toString());

    const { data } = await axios.get<GoogleTokenResult>(
      googleOauthURL.toString(),
      {
        responseType: "json",
      }
    );

    const user = await prismaClient.user.findUnique({
      where: { email: data.email.toString() },
    });

    if (!user) {
      await prismaClient.user.create({
        data: {
          email: data.email.toString(),
          firstName: data.given_name.toString(),
          lastName: data.family_name?.toString(),
          profileImageURL: data.picture?.toString(),
        },
      });
    }

    const userInDb = await prismaClient.user.findUnique({
      where: { email: data.email.toString() },
    });

    if (!userInDb) throw new Error("User With Email Not Found");

    const userToken = JWTService.generateTokenForUser(userInDb);

    return userToken;
  },
};

export const resolvers = { queries };
