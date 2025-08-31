import { Route } from '../../../types/route';
import { IWebcastRoomChatPayload, IWebcastRoomChatRouteResponse } from '@eulerstream/euler-api-sdk';
import { AxiosRequestConfig } from 'axios';
export declare type SendRoomChatFromEulerRouteParams = IWebcastRoomChatPayload & {
    options?: AxiosRequestConfig;
};
export declare class SendRoomChatFromEulerRoute extends Route<SendRoomChatFromEulerRouteParams, IWebcastRoomChatRouteResponse> {
    call({ roomId, content, sessionId, ttTargetIdc, options }: SendRoomChatFromEulerRouteParams): Promise<IWebcastRoomChatRouteResponse>;
}
//# sourceMappingURL=send-room-chat-euler.d.ts.map