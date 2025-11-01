import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const JWT_SECRET = process.env.JWT_SECRET;
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      
      // Return minimal user information
      return NextResponse.json({
        valid: true,
        user: {
          id: decoded.id || decoded.userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role || 'USER'
        }
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      
      // Handle specific JWT errors
      if (jwtError instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: 'Token expired', valid: false },
          { status: 401 }
        );
      }
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { error: 'Invalid token', valid: false },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Token verification failed', valid: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Verify endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}