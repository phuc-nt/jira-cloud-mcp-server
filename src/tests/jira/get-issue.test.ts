import { getIssueHandler } from '../../tools/jira/get-issue.js';
import { callJiraApi, adfToMarkdown } from '../../utils/atlassian-api.js';
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

describe('getIssueHandler', () => {
  // Thiết lập mock và cấu hình trước mỗi test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockConfig = {
    baseUrl: 'https://test.atlassian.net',
    apiToken: 'test-token',
    email: 'test@example.com'
  };
  
  const mockIssueResponse = {
    id: '12345',
    key: 'TEST-123',
    fields: {
      summary: 'Test Issue Summary',
      description: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test description' }] }]
      },
      status: { name: 'In Progress' },
      issuetype: { name: 'Bug' },
      priority: { name: 'High' },
      assignee: { displayName: 'Test User' },
      reporter: { displayName: 'Reporter User' },
      created: '2023-01-01T12:00:00.000Z',
      updated: '2023-01-02T12:00:00.000Z',
      labels: ['test', 'bug']
    },
    transitions: [
      { id: 't1', name: 'Done' },
      { id: 't2', name: 'Rejected' }
    ]
  };
  
  test('should fetch and return issue details successfully', async () => {
    // Arrange
    const mockParams = { issueIdOrKey: 'TEST-123' };
    (callJiraApi as jest.Mock).mockResolvedValue(mockIssueResponse);
    (adfToMarkdown as jest.Mock).mockReturnValue('Test description');
    
    // Act
    const result = await getIssueHandler(mockParams, mockConfig);
    
    // Assert
    expect(callJiraApi).toHaveBeenCalledWith(
      mockConfig,
      '/issue/TEST-123?expand=renderedFields,names,transitions',
      'GET'
    );
    
    expect(result).toEqual({
      id: '12345',
      key: 'TEST-123',
      summary: 'Test Issue Summary',
      description: 'Test description',
      status: 'In Progress',
      issueType: 'Bug',
      priority: 'High',
      assignee: 'Test User',
      reporter: 'Reporter User',
      created: '2023-01-01T12:00:00.000Z',
      updated: '2023-01-02T12:00:00.000Z',
      labels: ['test', 'bug'],
      comments: [],
      availableTransitions: [
        { id: 't1', name: 'Done' },
        { id: 't2', name: 'Rejected' }
      ]
    });
  });
  
  test('should handle issue with no description', async () => {
    // Arrange
    const mockParams = { issueIdOrKey: 'TEST-124' };
    const issueWithNoDescription = {
      ...mockIssueResponse,
      key: 'TEST-124',
      fields: {
        ...mockIssueResponse.fields,
        description: null
      }
    };
    
    (callJiraApi as jest.Mock).mockResolvedValue(issueWithNoDescription);
    
    // Act
    const result = await getIssueHandler(mockParams, mockConfig);
    
    // Assert
    expect(result.description).toBe('');
    expect(result.key).toBe('TEST-124');
  });
  
  test('should handle issue with comments', async () => {
    // Arrange
    const mockParams = { issueIdOrKey: 'TEST-125' };
    const issueWithComments = {
      ...mockIssueResponse,
      key: 'TEST-125',
      fields: {
        ...mockIssueResponse.fields,
        comment: {
          comments: [
            {
              id: 'comment-1',
              author: { displayName: 'Commenter 1' },
              created: '2023-01-03T12:00:00.000Z',
              body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test comment' }] }] }
            }
          ]
        }
      }
    };
    
    (callJiraApi as jest.Mock).mockResolvedValue(issueWithComments);
    (adfToMarkdown as jest.Mock)
      .mockReturnValueOnce('Test description')
      .mockReturnValueOnce('Test comment');
    
    // Act
    const result = await getIssueHandler(mockParams, mockConfig);
    
    // Assert
    expect(result.comments).toEqual([
      {
        id: 'comment-1',
        author: 'Commenter 1',
        created: '2023-01-03T12:00:00.000Z',
        content: 'Test comment'
      }
    ]);
  });
  
  test('should handle API error', async () => {
    // Arrange
    const mockParams = { issueIdOrKey: 'TEST-126' };
    const mockError = new ApiError('ERROR_TYPE', 'API Error', 500);
    
    (callJiraApi as jest.Mock).mockRejectedValue(mockError);
    
    // Act & Assert
    await expect(getIssueHandler(mockParams, mockConfig)).rejects.toThrow(mockError);
  });
}); 