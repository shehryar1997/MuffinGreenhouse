// Current time as a function call. Server components that compare against "now" call this instead of
// Date.now() inline, which the React compiler lint treats as an impure call during render even though
// these pages are rendered per request on the server.
export const nowMs = (): number => Date.now()
