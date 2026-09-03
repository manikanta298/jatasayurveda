const MAX_PASSWORD_LENGTH = 128;

// Keep the UI aligned with the backend Joi password limit. This is delegated
// at document level because the authentication dialog is rendered lazily and
// its password inputs are mounted/unmounted dynamically.
function enforcePasswordLimit(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "password") return;

  input.maxLength = MAX_PASSWORD_LENGTH;

  if (input.value.length > MAX_PASSWORD_LENGTH) {
    input.value = input.value.slice(0, MAX_PASSWORD_LENGTH);
  }
}

function markPasswordInputs(root = document) {
  root.querySelectorAll?.('input[type="password"]').forEach((input) => {
    input.maxLength = MAX_PASSWORD_LENGTH;
    input.setAttribute("autocomplete", input.id.includes("login") ? "current-password" : "new-password");
  });
}

export function installPasswordGuard() {
  markPasswordInputs();
  document.addEventListener("focusin", enforcePasswordLimit);
  document.addEventListener("input", enforcePasswordLimit);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) markPasswordInputs(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    document.removeEventListener("focusin", enforcePasswordLimit);
    document.removeEventListener("input", enforcePasswordLimit);
    observer.disconnect();
  };
}
