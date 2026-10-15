export function shoeArtwork(
  category: string,
  color = "#e8e3d4",
  alternate = false,
  designIndex = 0,
) {
  const style = ((designIndex % 6) + 6) % 6;
  const boot = category === "Boots";
  const formal = category === "Formal";
  const casual = category === "Casual";
  const running = category === "Running";
  const collarY = [216, 192, 228, 205, 184, 220][style];
  const toeY = [282, 273, 288, 277, 267, 284][style];
  const upper = boot
    ? `M154 284 L180 ${style === 1 || style === 4 ? 118 : 148} Q240 ${style === 1 ? 100 : 124} 329 141 L338 225 Q352 245 405 261 L531 ${toeY - 2} Q555 285 569 313 L558 342 L162 344 Z`
    : formal
      ? `M135 289 Q177 ${collarY + 31} 229 ${collarY + 44} L303 ${collarY + 19} Q333 238 365 266 L501 ${toeY - 5} Q549 287 567 317 L550 341 L135 336 Z`
      : `M132 291 Q147 242 173 ${collarY} L213 ${collarY + 13} Q255 188 283 211 L340 255 Q390 269 454 277 L523 ${toeY} Q552 285 570 318 L551 348 L138 346 Z`;
  const styleDetails = [
    '<path d="M182 302Q263 329 348 313" fill="none" stroke="#fffdf3" stroke-opacity=".7" stroke-width="3"/>',
    '<path d="M164 293Q205 245 239 265L296 304L374 292M374 292L459 283" fill="none" stroke="#f3eee2" stroke-width="8" stroke-linejoin="round"/><path d="M166 300Q207 252 238 272" fill="none" stroke="#7d8771" stroke-width="2"/>',
    '<path d="M302 241Q334 244 365 269L351 308Q329 286 296 280Z" fill="#e7e3d8" stroke="#8a8b80" stroke-width="2"/><path d="M298 253L355 275" stroke="#808678" stroke-width="4"/>',
    '<path d="M441 281Q507 276 545 312L530 333L410 333Z" fill="#d9d4c7" stroke="#898b7f" stroke-width="2"/><path d="M439 287Q492 284 531 312" fill="none" stroke="#f7f4e8" stroke-width="3"/>',
    '<path d="M157 294Q202 239 232 260L294 297L352 290L435 282" fill="none" stroke="#f7f4e8" stroke-width="11" stroke-linejoin="round"/><path d="M188 275L219 290L278 311L334 307L370 295" fill="none" stroke="#87926f" stroke-width="4"/>',
    '<g fill="#384035" opacity=".55"><circle cx="190" cy="281" r="3"/><circle cx="202" cy="287" r="3"/><circle cx="214" cy="293" r="3"/><circle cx="226" cy="299" r="3"/><circle cx="238" cy="305" r="3"/></g><path d="M177 308Q252 332 337 315" fill="none" stroke="#fffdf3" stroke-width="2"/>',
  ][style];
  const laceMarkup =
    style === 2
      ? ""
      : '<g stroke="#f7f6e9" stroke-width="7" stroke-linecap="round"><path d="M250 236L292 224M260 247L306 238M274 260L321 250M287 273L333 263"/></g><g fill="#6f7966"><circle cx="248" cy="235" r="3"/><circle cx="261" cy="247" r="3"/><circle cx="275" cy="260" r="3"/><circle cx="288" cy="273" r="3"/></g>';
  const soleTread = Array.from({ length: 6 + (style % 3) }, (_, index) => {
    const x = 173 + index * (343 / (5 + (style % 3)));
    return `<path d="M${x} 355L${x + 6} 370" stroke="#20261c" stroke-width="5"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 480"><defs><linearGradient id="u" x1="0" y1="0" x2="0.4" y2="1"><stop stop-color="#ffffff"/><stop offset=".38" stop-color="${color}"/><stop offset="1" stop-color="${formal ? "#372e28" : "#a5a79d"}"/></linearGradient><linearGradient id="s" x2="0" y2="1"><stop stop-color="#fffdf3"/><stop offset="1" stop-color="#bdbeb1"/></linearGradient><linearGradient id="p"><stop stop-color="#dedbd0"/><stop offset=".6" stop-color="#f4f2e9"/><stop offset="1" stop-color="#c7c5b9"/></linearGradient><pattern id="mesh" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".65" fill="#343830" opacity=".2"/></pattern><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs><ellipse cx="353" cy="379" rx="239" ry="17" fill="#3b4032" opacity=".15" filter="url(#blur)"/><g transform="${alternate ? "translate(693 0) scale(-1 1)" : "rotate(-9 350 280)"}"><path d="M133 327 Q252 343 344 335 L562 316 L581 341 Q575 365 541 369 L166 371 Q139 364 130 350Z" fill="#292e26"/><path d="M132 318 Q240 329 337 320 L565 308 L575 331 Q568 351 535 353 L170 357 Q137 352 130 336Z" fill="url(#s)"/><path d="${upper}" fill="url(#u)" stroke="#555b4c" stroke-opacity=".25" stroke-width="2"/><path d="${upper}" fill="url(#mesh)" opacity="${formal || boot ? ".16" : ".7"}"/>${formal ? '<path d="M185 273Q260 274 279 321 M425 284 Q455 313 456 335" fill="none" stroke="#241f19" stroke-opacity=".5" stroke-width="2"/>' : `<path d="M151 292 Q201 239 226 264 L291 300 L346 294 L440 285 Q416 314 369 326 L286 333 L216 301 L165 322Z" fill="${casual ? "#eeeadd" : "#e2e3d5"}" stroke="#9c9f90" stroke-width="1.5"/><path d="M189 272L218 286 L278 308 L334 304 L370 292" fill="none" stroke="${running ? "#a3c943" : "#7b896e"}" stroke-width="7" stroke-linecap="round"/><path d="M445 285 Q491 284 523 301L536 330 L401 333Z" fill="url(#p)" stroke="#9c9f90" stroke-width="1"/>`}${styleDetails}<path d="M173 227Q194 220 214 241L224 259L169 276Z" fill="#383d32" opacity=".75"/><path d="M241 ${boot ? "162" : "225"}L292 ${boot ? "179" : "215"}L346 267L291 286Z" fill="url(#p)" stroke="#939787" stroke-width="1.5"/>${laceMarkup}<path d="M150 339Q254 354 346 339L549 326" fill="none" stroke="#999e8c" stroke-width="2"/>${soleTread}<text x="365" y="311" fill="#444d3b" font-family="sans-serif" font-size="10" letter-spacing="3">SOLEVA</text></g></svg>`;
}
