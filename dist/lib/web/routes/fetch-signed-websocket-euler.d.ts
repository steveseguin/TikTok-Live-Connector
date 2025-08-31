import { Route } from '../../../types/route';
import { FetchSignedWebSocketParams } from '../../../types/client';
import { ProtoMessageFetchResult } from '../../../types';
export declare type FetchSignedWebSocketFromEulerRouteParams = FetchSignedWebSocketParams;
export declare class FetchSignedWebSocketFromEulerRoute extends Route<FetchSignedWebSocketFromEulerRouteParams, ProtoMessageFetchResult> {
    call({ roomId, uniqueId, preferredAgentIds, sessionId, ttTargetIdc }: FetchSignedWebSocketFromEulerRouteParams): Promise<ProtoMessageFetchResult>;
}
//# sourceMappingURL=fetch-signed-websocket-euler.d.ts.map