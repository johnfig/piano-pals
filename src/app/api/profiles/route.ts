import { NextResponse } from 'next/server';
import { getAllProfiles, upsertProfile } from '@/lib/db';
import { UserProfile } from '@/types/game';

// GET /api/profiles — list all profiles
export async function GET() {
  try {
    const profiles = await getAllProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Failed to load profiles:', error);
    return NextResponse.json({ error: 'Failed to load profiles' }, { status: 500 });
  }
}

// POST /api/profiles — create a new profile
export async function POST(request: Request) {
  try {
    const profile: UserProfile = await request.json();
    await upsertProfile(profile);
    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Failed to create profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}
