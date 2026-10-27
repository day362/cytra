/**
 * Runs before first paint so a forced light/dark preference never flashes.
 * Kept tiny and dependency-free; mirrors the storage key in lib/theme.ts.
 */
const script = `(()=>{try{var t=localStorage.getItem("cytra-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
