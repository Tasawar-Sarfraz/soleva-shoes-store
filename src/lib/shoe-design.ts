export function shoeDesignIndex(productId: string) {
  const suffix = productId.match(/-(\d{2})$/)?.[1];
  if (suffix) return (Number(suffix) - 1) % 6;

  return (
    [...productId].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    ) % 6
  );
}
