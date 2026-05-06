(() => {
  const app = document.getElementById("app");
  if (!app) return;

  function cleanup() {
    const odaCard = app.querySelector('.play-card[data-g^="oda-"]');
    if (!odaCard) return;
    const stage = odaCard.closest(".single-stage") || odaCard.parentElement;
    if (!stage) return;
    stage.querySelectorAll(".radial-feedback").forEach((node) => {
      node.innerHTML = "";
      node.style.display = "none";
      node.remove();
    });
  }

  const observer = new MutationObserver(() => cleanup());
  observer.observe(app, { childList: true, subtree: true });

  cleanup();
  requestAnimationFrame(cleanup);
  setTimeout(cleanup, 0);
  setTimeout(cleanup, 120);
  setTimeout(cleanup, 400);
})();
