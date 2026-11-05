import { createHmac, randomUUID } from "node:crypto";

/** Standard Webhooks signature required by grok.com automation triggers. */
export function signedWebhookHeaders(
  signingSecret: string,
  serializedBody: string,
): Record<string, string> {
  if (!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(signingSecret)) {
    throw new Error(
      "Enter the automation signing secret, beginning with whsec_.",
    );
  }
  const key = Buffer.from(signingSecret.slice("whsec_".length), "base64");
  if (key.length < 16)
    throw new Error("The automation signing secret is incomplete.");
  const deliveryId = `msg_${randomUUID().replaceAll("-", "")}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", key)
    .update(`${deliveryId}.${timestamp}.${serializedBody}`)
    .digest("base64");
  return {
    "content-type": "application/json",
    "webhook-id": deliveryId,
    "webhook-timestamp": timestamp,
    "webhook-signature": `v1,${signature}`,
  };
}
