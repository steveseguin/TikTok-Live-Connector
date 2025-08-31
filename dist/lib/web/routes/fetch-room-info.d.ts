import { Route } from '../../../types/route';
import { RoomInfo } from '../../../types/client';
export declare type RoomInfoRouteParams = {
    roomId?: string;
} | void;
export declare type RoomInfoResponse = any;
export declare class FetchRoomInfoRoute extends Route<RoomInfoRouteParams, RoomInfoResponse> {
    call(params: RoomInfoRouteParams): Promise<RoomInfo>;
}
//# sourceMappingURL=fetch-room-info.d.ts.map