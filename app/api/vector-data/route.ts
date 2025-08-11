import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL_LOCAL = "http://localhost:5000/"
const BACKEND_URL_DEPLOYED = "https://mechanical-jacki-sachin-gupa-df0f5d51.koyeb.app/"
let BACKEND_URL = BACKEND_URL_DEPLOYED

export async function POST(request: NextRequest) {
  try {
    const { question, reductionMethod = 'PCA' } = await request.json()

    // Call your Flask backend to get vector data
    const response = await fetch(`${BACKEND_URL}vector-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, reductionMethod })
    })

    if (!response.ok) {
      throw new Error('Failed to fetch vector data from backend')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Vector data API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vector data' },
      { status: 500 }
    )
  }
} 