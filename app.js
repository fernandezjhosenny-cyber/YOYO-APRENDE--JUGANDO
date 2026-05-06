const visionButton = document.getElementById("visionButton");
const visionModal = document.getElementById("visionModal");
const closeVision = document.getElementById("closeVision");

function openModal() {
  visionModal.classList.remove("hidden");
}

function closeModal() {
  visionModal.classList.add("hidden");
}

visionButton.addEventListener("click", openModal);
closeVision.addEventListener("click", closeModal);

visionModal.addEventListener("click", (event) => {
  if (event.target === visionModal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !visionModal.classList.contains("hidden")) {
    closeModal();
  }
});
