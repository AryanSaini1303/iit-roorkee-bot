import { NextResponse } from 'next/server';

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const pdfName = searchParams.get('pdf_name');
        const origin = searchParams.get('origin');
        const response = await fetch(
            `${process.env.PUBLIC_API_URL}/delete-pdf?pdf_name=${encodeURIComponent(pdfName)}`,
            { method: 'DELETE', headers: { 'X-Origin': origin } }
        );
        const data = await response.json();
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete pdf', details: err.message }, { status: 500 });
    }
}