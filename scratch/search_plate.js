const fs = require('fs');

async function searchRealPlate() {
    const queries = [
        'https://html.duckduckgo.com/html/?q=LPS0905',
        'https://html.duckduckgo.com/html/?q=LPS-0905'
    ];
    for (const q of queries) {
        try {
            const res = await fetch(q, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const html = await res.text();
            console.log('Q:', q, 'Len:', html.length);
            const matches = html.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/gi) || [];
            matches.forEach(m => {
                const text = m.replace(/<[^>]+>/g, '').trim();
                console.log('Match:', text);
            });
        } catch(e) {
            console.error(e.message);
        }
    }
}
searchRealPlate();
