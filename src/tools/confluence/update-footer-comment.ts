import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { updateConfluenceFooterCommentV2 } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('ConfluenceTools:updateFooterComment');

export const updateFooterCommentSchema = z.object({
  commentId: z.union([z.string(), z.number()]).describe('ID của comment cần cập nhật (bắt buộc)'),
  version: z.number().describe('Số phiên bản mới (bắt buộc, phải lớn hơn phiên bản hiện tại 1 đơn vị)'),
  value: z.string().describe('Nội dung comment mới (bắt buộc)'),
  representation: z.string().optional().describe('Định dạng nội dung, mặc định là "storage"'),
  message: z.string().optional().describe('Thông điệp mô tả lý do cập nhật (tùy chọn)')
});

type UpdateFooterCommentParams = z.infer<typeof updateFooterCommentSchema>;

export async function updateFooterCommentHandler(
  params: UpdateFooterCommentParams,
  config: AtlassianConfig
): Promise<{ success: boolean; id: string|number; version: number; message: string }> {
  try {
    logger.info(`Updating footer comment (v2) with ID: ${params.commentId}`);
    const data = await updateConfluenceFooterCommentV2(config, params);
    return {
      success: true,
      id: params.commentId,
      version: data.version?.number,
      message: `Footer comment ${params.commentId} updated to version ${data.version?.number} thành công.`
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`Error updating footer comment (v2) with ID ${params.commentId}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to update footer comment: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

export const registerUpdateFooterCommentTool = (server: McpServer) => {
  server.tool(
    'updateFooterComment',
    'Update a footer comment in Confluence (API v2)',
    updateFooterCommentSchema.shape,
    async (params: UpdateFooterCommentParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        const config = (context as any).atlassianConfig as AtlassianConfig;
        if (!config) return createErrorResponse('Invalid or missing Atlassian configuration');
        const result = await updateFooterCommentHandler(params, config);
        return createTextResponse(result.message, { id: result.id, version: result.version, success: result.success });
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        return createErrorResponse(`Error while updating footer comment: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}; 