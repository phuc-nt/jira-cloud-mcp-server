import { createPageHandler } from '../../tools/confluence/create-page.js';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { ApiError } from '../../utils/error-handler.js';

// Mock cho các dependencies
jest.mock('../../utils/atlassian-api.js');
jest.mock('../../utils/logger.js', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    })
  }
}));

describe('createPageHandler', () => {
  // Thiết lập mock và cấu hình trước mỗi test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockConfig = {
    baseUrl: 'https://test.atlassian.net',
    apiToken: 'test-token',
    email: 'test@example.com'
  };
  
  const mockPageResponse = {
    id: '12345',
    type: 'page',
    status: 'current',
    title: 'Test Page Title',
    space: {
      key: 'TESTSPACE',
      name: 'Test Space'
    },
    _links: {
      webui: '/spaces/TESTSPACE/pages/12345',
      self: '/rest/api/content/12345'
    }
  };
  
  test('should create page successfully', async () => {
    // Arrange
    const mockParams = {
      spaceKey: 'TESTSPACE',
      title: 'Test Page Title',
      content: '<p>This is test content</p>'
    };
    
    (callConfluenceApi as jest.Mock).mockResolvedValue(mockPageResponse);
    
    // Act
    const result = await createPageHandler(mockParams, mockConfig);
    
    // Assert
    expect(callConfluenceApi).toHaveBeenCalledWith(
      mockConfig,
      '/content',
      'POST',
      expect.objectContaining({
        type: 'page',
        title: 'Test Page Title',
        space: { key: 'TESTSPACE' },
        body: {
          storage: {
            value: '<p>This is test content</p>',
            representation: 'storage'
          }
        }
      })
    );
    
    expect(result).toEqual({
      id: '12345',
      type: 'page',
      status: 'current',
      title: 'Test Page Title',
      spaceKey: 'TESTSPACE',
      _links: {
        webui: '/spaces/TESTSPACE/pages/12345',
        self: '/rest/api/content/12345'
      },
      success: true
    });
  });
  
  test('should create page with parent ID', async () => {
    // Arrange
    const mockParams = {
      spaceKey: 'TESTSPACE',
      title: 'Child Page Title',
      content: '<p>This is child page content</p>',
      parentId: '98765'
    };
    
    (callConfluenceApi as jest.Mock).mockResolvedValue({
      ...mockPageResponse,
      title: 'Child Page Title'
    });
    
    // Act
    const result = await createPageHandler(mockParams, mockConfig);
    
    // Assert
    expect(callConfluenceApi).toHaveBeenCalledWith(
      mockConfig,
      '/content',
      'POST',
      expect.objectContaining({
        ancestors: [{ id: '98765' }]
      })
    );
    
    expect(result.title).toBe('Child Page Title');
  });
  
  test('should create page with labels', async () => {
    // Arrange
    const mockParams = {
      spaceKey: 'TESTSPACE',
      title: 'Labeled Page',
      content: '<p>This page has labels</p>',
      labels: ['test', 'documentation']
    };
    
    (callConfluenceApi as jest.Mock)
      .mockResolvedValueOnce({
        ...mockPageResponse,
        title: 'Labeled Page'
      })
      .mockResolvedValueOnce({}); // Response for adding labels
    
    // Act
    const result = await createPageHandler(mockParams, mockConfig);
    
    // Assert
    // Kiểm tra cuộc gọi đầu tiên để tạo trang
    expect(callConfluenceApi).toHaveBeenNthCalledWith(
      1,
      mockConfig,
      '/content',
      'POST',
      expect.any(Object)
    );
    
    // Kiểm tra cuộc gọi thứ hai để thêm labels
    expect(callConfluenceApi).toHaveBeenNthCalledWith(
      2,
      mockConfig,
      '/content/12345/label',
      'POST',
      [{ name: 'test' }, { name: 'documentation' }]
    );
    
    expect(result.title).toBe('Labeled Page');
    expect(result.success).toBe(true);
  });
  
  test('should handle API error', async () => {
    // Arrange
    const mockParams = {
      spaceKey: 'INVALID',
      title: 'Error Page',
      content: '<p>This will cause an error</p>'
    };
    
    const mockError = new ApiError('ERROR_TYPE', 'API Error', 500);
    (callConfluenceApi as jest.Mock).mockRejectedValue(mockError);
    
    // Act & Assert
    await expect(createPageHandler(mockParams, mockConfig)).rejects.toThrow(mockError);
  });
}); 