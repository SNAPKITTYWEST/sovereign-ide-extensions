\ GRAVEYARD MAP — SNAPKITTYWEST/sovereign-ide-extensions
\ 1 repos | rendered by AHMAD-BOT + Forth renderer
\ The graveyard in Forth. Every repo is a word.

\ ── sovereign-ide-extensions (gravity: 0.2, status: orphan) ──
: crawl-sovereign-ide-extensions ( -- )
  0.2 gravity
  dup alive? IF
    ." sovereign-ide-extensions alive " cr
  ELSE dup broken? IF
    ." sovereign-ide-extensions broken " cr
    "sovereign-ide-extensions" repair
  ELSE
    ." sovereign-ide-extensions orphan " cr
    "sovereign-ide-extensions" flag
  THEN THEN
  drop
;

: crawl-graveyard ( -- )
  ." === SNAPKITTYWEST/sovereign-ide-extensions GRAVEYARD CRAWL ===" cr
  crawl-sovereign-ide-extensions
  ." === CRAWL COMPLETE ===" cr
;

crawl-graveyard