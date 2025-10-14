import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
  };
}

export async function generateAISummary(
  messages: Message[],
  channelName: string,
  teamName: string
): Promise<string> {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  // Format messages for Claude
  const conversationText = messages
    .map(msg => `${msg.user.username}: ${msg.content}`)
    .join('\n');

  const prompt = `You are an AI assistant helping to summarize team conversations for Arcyn Link, a communication platform.

Please analyze the following conversation from the "${channelName}" channel in the ${teamName} team and provide a comprehensive summary.

Conversation:
${conversationText}

Please provide a summary that includes:

1. **Key Discussion Points**: Main topics and themes discussed
2. **Important Decisions**: Any decisions made or agreed upon
3. **Action Items**: Tasks, assignments, or next steps mentioned
4. **Key Insights**: Important insights, ideas, or solutions shared
5. **Participants**: Who were the main contributors to the discussion

Format your response in clear, organized sections using markdown. Keep it concise but comprehensive, focusing on actionable information and important outcomes.

If the conversation is too brief or lacks substantial content, provide a brief summary of what was discussed.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    } else {
      throw new Error('Unexpected response format from Claude');
    }
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Fallback summary if Claude fails
    const participantCount = new Set(messages.map(m => m.user.username)).size;
    const messageCount = messages.length;
    
    return `## Summary

**Discussion Overview**: This thread in the ${channelName} channel involved ${participantCount} participant(s) with ${messageCount} message(s).

**Key Points**: 
- Conversation took place between ${messages[0]?.createdAt} and ${messages[messages.length - 1]?.createdAt}
- Main participants: ${Array.from(new Set(messages.map(m => m.user.username))).join(', ')}

*Note: Detailed AI analysis temporarily unavailable. Please review the conversation manually for specific insights and action items.*`;
  }
}
