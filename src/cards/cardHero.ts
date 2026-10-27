// The card that morphs between the grid and the viewer carries the view-transition name `card-hero`.
// On return it is set at render time (CardGrid's heroCardId); on click it is set imperatively, so no
// card subscribes to useViewTransitionState (which re-renders every card on every navigation).

/** Names `el` for the morph and clears the name from any other element, so it is never duplicated. */
function markHero(el: HTMLElement, name: string): void {
  for (const other of document.querySelectorAll<HTMLElement>(`[style*="${name}"]`)) {
    if (other !== el) other.style.viewTransitionName = '';
  }
  el.style.viewTransitionName = name;
}

export const markCardHero = (el: HTMLElement) => markHero(el, 'card-hero');
