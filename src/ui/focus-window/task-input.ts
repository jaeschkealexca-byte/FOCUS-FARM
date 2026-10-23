export function createTaskInput(
  onInput: (value: string) => void,
  onSubmit: () => void,
  onCancel: () => void,
  onKeyHandled: () => void,
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 48;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Task name');
  Object.assign(input.style, {
    position: 'fixed', zIndex: '1000', boxSizing: 'border-box', padding: '0', border: '0',
    outline: 'none', background: 'transparent', color: 'transparent', caretColor: 'transparent',
    textShadow: 'none', opacity: '1', userSelect: 'text', pointerEvents: 'auto',
  });
  input.addEventListener('input', () => {
    if (input.value.length > 48) input.value = input.value.slice(0, 48);
    onInput(input.value);
  });
  input.addEventListener('keydown', event => {
    onKeyHandled();
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      onSubmit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    } else {
      event.stopPropagation();
    }
  });
  document.body.appendChild(input);
  input.focus();
  return input;
}
