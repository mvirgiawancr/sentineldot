export const PORTALDOT = {
  name: "PortaldotV3 Testnet",
  chainId: 420420777,
  rpc: "https://test-evm-rpc-v3.portaldot.dev",
  wss: "wss://test-node-v3.portaldot.dev",
  explorer: "https://node-console.portaldot.dev",
} as const;

/** measured from consecutive chain timestamps on the v3 testnet */
export const TARGET_BLOCK_SECONDS = 6;

export type Endpoint = {
  id: string;
  label: string;
  url: string;
  role: "reference" | "public";
};

export const ENDPOINTS: Endpoint[] = [
  { id: "v3-evm", label: "test-evm-rpc-v3", url: PORTALDOT.rpc, role: "reference" },
  { id: "v3-node", label: "test-node-v3 (WSS)", url: PORTALDOT.wss, role: "reference" },
];

export type Sample = {
  block: number;
  gasPriceGwei: number;
  at: number;
};

export type RpcProbe = {
  endpointId: string;
  latencyMs: number | null;
  block: number | null;
  ok: boolean;
  error?: string;
};

export const OUTPUT_SNIPPETS = {
  prometheus: `scrape_configs:
  - job_name: portaldot-validator
    metrics_path: /metrics
    static_configs:
      - targets: ['127.0.0.1:9615']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: validator-01`,
  systemd: `[Unit]
Description=Portaldot validator sentry
After=network-online.target

[Service]
ExecStart=/opt/sentinel/bin/probe --rpc $RPC --interval 12s
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target`,
  curl: `curl -s -X POST $RPC \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber"}'`,
} as const;

export type SnippetKey = keyof typeof OUTPUT_SNIPPETS;
