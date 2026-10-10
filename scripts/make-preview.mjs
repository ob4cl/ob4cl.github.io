import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
const types={'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
const assets=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,item.name);if(item.isDirectory())walk(f);else if(types[path.extname(f)])assets.push({url:'/'+path.relative(dist,f).split(path.sep).join('/'),data:`data:${types[path.extname(f)]};base64,${fs.readFileSync(f).toString('base64')}`});}}
walk(dist);
function inlineAssets(content){for(const {url,data} of assets)content=content.split(url).join(data).split('./'+path.basename(url)).join(data);return content;}
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_,url)=>'<style>'+inlineAssets(fs.readFileSync(path.join(dist,url),'utf8'))+'</style>');
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_,url)=>'<script type="module">'+inlineAssets(fs.readFileSync(path.join(dist,url),'utf8')).replaceAll('</script','<\\/script')+'</script>');
html=inlineAssets(html);
const notices=fs.readFileSync(path.join(root,'public/THIRD-PARTY-NOTICES.md'),'utf8');
html=html.replace('</html>','<!-- THIRD-PARTY NOTICES\n'+notices.replaceAll('-->', '-- >')+'\n-->\n</html>');
fs.writeFileSync(path.join(root,'preview.html'),html);
console.log(`Standalone preview created: ${path.join(root,'preview.html')} (${Buffer.byteLength(html)} bytes)`);
