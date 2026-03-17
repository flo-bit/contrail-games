import {
  CompositeDidDocumentResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
} from "@atcute/identity-resolver";
import { type Did } from "@atcute/lexicons";
import { Client, simpleFetchHandler } from "@atcute/client";
import type {} from "@atcute/atproto";
import type { Database } from "./types";

// Slingshot-first PDS resolution with fallback to DID document resolution
const SLINGSHOT_URL =
  "https://slingshot.microcosm.blue/xrpc/com.bad-example.identity.resolveMiniDoc";

export interface ResolvedIdentity {
  did: string;
  handle: string | null;
  pds: string | null;
}

async function resolveViaSlingshot(
  identifier: string
): Promise<ResolvedIdentity | undefined> {
  const url = new URL(SLINGSHOT_URL);
  url.searchParams.set("identifier", identifier);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return undefined;
    const data = (await response.json()) as {
      did?: string;
      handle?: string;
      pds?: string;
    };
    if (!data.did && !data.pds) return undefined;
    return {
      did: data.did ?? identifier,
      handle: data.handle ?? null,
      pds: data.pds ?? null,
    };
  } catch {
    return undefined;
  }
}

const didResolver = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(),
    web: new WebDidDocumentResolver(),
  },
});

async function getPDSViaDidDoc(did: Did): Promise<string | undefined> {
  const doc = await didResolver.resolve(did as Did<"plc"> | Did<"web">);
  return doc.service
    ?.find((s) => s.id === "#atproto_pds")
    ?.serviceEndpoint.toString();
}

/**
 * Resolve identity info (did, handle, pds) for a DID or handle.
 * Uses slingshot first, falls back to DID doc for PDS.
 */
export async function resolvePDS(
  identifier: string
): Promise<ResolvedIdentity | undefined> {
  const result = await resolveViaSlingshot(identifier);
  if (result?.pds) return result;

  // Fall back to DID doc resolution (only works for DIDs, not handles)
  if (identifier.startsWith("did:")) {
    try {
      const pds = await getPDSViaDidDoc(identifier as Did);
      if (pds) {
        return {
          did: identifier,
          handle: result?.handle ?? null,
          pds,
        };
      }
    } catch {
      // ignore
    }
  }

  return result;
}

export async function getPDS(
  did: Did,
  db?: Database
): Promise<string | undefined> {
  // Check cached PDS first
  if (db) {
    const cached = await db
      .prepare("SELECT pds FROM identities WHERE did = ? AND pds IS NOT NULL")
      .bind(did)
      .first<{ pds: string }>();
    if (cached?.pds) return cached.pds;
  }

  const resolved = await resolvePDS(did);
  return resolved?.pds ?? undefined;
}

export async function getClient(did: Did, db?: Database): Promise<Client> {
  const pds = await getPDS(did, db);
  if (!pds) throw new Error(`PDS not found for ${did}`);
  return new Client({
    handler: simpleFetchHandler({ service: pds }),
  });
}
