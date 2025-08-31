import { Route } from '../../../types/route';
import { FetchRoomInfoFromApiRouteResponse } from '../../../lib/web/routes/fetch-room-info-api-live';
export declare type FetchRoomInfoFromHtmlRouteParams = {
    uniqueId: string;
};
export declare type FetchRoomInfoFromHtmlRouteResponse = Record<string, any> & {
    liveRoomUserInfo?: FetchRoomInfoFromApiRouteResponse['data'];
};
export declare class FetchRoomInfoFromHtmlRoute extends Route<FetchRoomInfoFromHtmlRouteParams, FetchRoomInfoFromHtmlRouteResponse> {
    call({ uniqueId }: {
        uniqueId: any;
    }): Promise<FetchRoomInfoFromHtmlRouteResponse>;
}
//# sourceMappingURL=fetch-room-info-html.d.ts.map