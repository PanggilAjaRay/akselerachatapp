import PusherServer from "pusher";
import PusherClient from "pusher-js";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_APP_KEY!,
  secret: process.env.PUSHER_APP_SECRET!,
  cluster: process.env.PUSHER_APP_CLUSTER!,
  useTLS: true,
});

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY || "dummy-key",
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || "ap1",
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
    },
  }
);
