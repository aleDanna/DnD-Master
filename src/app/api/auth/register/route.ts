import { NextRequest, NextResponse } from 'next/server';
import { authService, registerSchema } from '@/lib/auth/auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    // Register user
    const result = await authService.register(validationResult.data);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, user: result.user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration route error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
