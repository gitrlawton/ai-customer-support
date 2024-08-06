import { NextResponse } from "next/server";

// export function POST(req) {
//     console.log('POST /api/chat');
//     return NextResponse.json({message: 'hello from the server'});
// }

export async function POST(req) {
    const data = await req.json()
    console.log(data)

    return NextResponse.json({message: 'hello from the server'});
}
