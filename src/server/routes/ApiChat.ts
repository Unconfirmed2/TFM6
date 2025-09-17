import * as responses from '../server/responses';
import {isPlayerId} from '../../common/Types';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';

export class ApiChat extends Handler {
  public static readonly INSTANCE = new ApiChat();

  private constructor() {
    super();
  }

  public override async get(req: Request, res: Response, ctx: Context): Promise<void> {
    const playerId = ctx.url.searchParams.get('id');
    const sinceId = ctx.url.searchParams.get('since');
    
    if (playerId === null) {
      responses.badRequest(req, res, 'missing id parameter');
      return;
    }
    if (!isPlayerId(playerId)) {
      responses.badRequest(req, res, 'invalid player id');
      return;
    }
    
    const game = await ctx.gameLoader.getGame(playerId);
    if (game === undefined) {
      responses.notFound(req, res);
      return;
    }
    
    try {
      const player = game.getPlayerById(playerId);
      if (!this.isUser(player.user, ctx)) {
        responses.notAuthorized(req, res);
        return;
      }

      ctx.ipTracker.addParticipant(playerId, ctx.ip);
      
      const messages = game.getChatMessages(sinceId || undefined);
      responses.writeJson(res, ctx, {
        messages,
        lastMessageId: game.chatData.lastMessageId,
        totalMessages: game.chatData.messages.length,
        maxMessages: 200,
      });
    } catch (err) {
      console.warn(`unable to find player ${playerId}`, err);
      responses.notFound(req, res);
      return;
    }
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const playerId = ctx.url.searchParams.get('id');
    
    if (playerId === null) {
      responses.badRequest(req, res, 'missing id parameter');
      return;
    }
    if (!isPlayerId(playerId)) {
      responses.badRequest(req, res, 'invalid player id');
      return;
    }
    
    const game = await ctx.gameLoader.getGame(playerId);
    if (game === undefined) {
      responses.notFound(req, res);
      return;
    }
    
    try {
      const player = game.getPlayerById(playerId);
      if (!this.isUser(player.user, ctx)) {
        responses.notAuthorized(req, res);
        return;
      }

      const body = await this.getRequestBody(req);
      const data = JSON.parse(body);
      
      if (!data.message || typeof data.message !== 'string') {
        responses.badRequest(req, res, 'invalid message');
        return;
      }
      
      const message = data.message.trim();
      if (message.length === 0) {
        responses.badRequest(req, res, 'empty message');
        return;
      }
      
      if (message.length > 500) {
        responses.badRequest(req, res, 'message too long');
        return;
      }

      ctx.ipTracker.addParticipant(playerId, ctx.ip);
      
      const messageId = game.addChatMessage(playerId, message);
      responses.writeJson(res, ctx, {
        success: true,
        messageId,
      });
    } catch (err) {
      console.warn(`error sending chat message for player ${playerId}`, err);
      responses.internalServerError(req, res, 'unable to send message');
      return;
    }
  }

  private async getRequestBody(req: Request): Promise<string> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (data) => {
        body += data.toString();
      });
      req.once('end', () => {
        resolve(body);
      });
    });
  }
}