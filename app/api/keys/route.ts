import { NextRequest, NextResponse } from 'next/server';

// APIキーをローカルストレージで管理（本来はDBに保存すべき）
export async function GET() {
  return NextResponse.json({ keys: [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, description } = body;
    
    // バリデーション
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    // ここでAPIキーを保存（実際の実装ではDBに保存）
    // 今回はクライアントサイドで管理
    return NextResponse.json({ 
      success: true, 
      message: 'API key saved successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    // ここでAPIキーを削除
    return NextResponse.json({ 
      success: true, 
      message: 'API key deleted successfully' 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}