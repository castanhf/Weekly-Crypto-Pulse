/**
 * React 19 removed the global `JSX` namespace. This shim re-declares it
 * using React's own types so existing `JSX.Element` return type annotations
 * continue to compile without per-file changes.
 *
 * @see https://react.dev/blog/2024/04/25/react-19-upgrade-guide#typescript-changes
 */
declare namespace JSX {
  type Element = import('react').JSX.Element;
  type ElementClass = import('react').JSX.ElementClass;
  type ElementAttributesProperty = import('react').JSX.ElementAttributesProperty;
  type ElementChildrenAttribute = import('react').JSX.ElementChildrenAttribute;
  type LibraryManagedAttributes<C, P> = import('react').JSX.LibraryManagedAttributes<C, P>;
  type IntrinsicAttributes = import('react').JSX.IntrinsicAttributes;
  type IntrinsicClassAttributes<T> = import('react').JSX.IntrinsicClassAttributes<T>;
  type IntrinsicElements = import('react').JSX.IntrinsicElements;
}
