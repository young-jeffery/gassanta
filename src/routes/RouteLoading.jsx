// Shown by route guards while Firebase is still working out who is signed in and which groups they belong to.
export default function RouteLoading() {
  return (
    <div className="flex flex-1 items-center justify-center" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <span aria-hidden="true" className="animate-pulse text-4xl text-ink/70 motion-reduce:animate-none">
        ❄
      </span>
    </div>
  );
}
