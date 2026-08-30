import { styled } from "storybook/theming";

/**
 * A native `select` that follows Storybook's manager theme.
 *
 * `color-scheme` is what makes the browser paint the native control and its
 * popup list in the right mode; without it the control follows the OS setting
 * and looks dark inside a light manager.
 */
export const Select = styled.select(({ theme }) => ({
  colorScheme: theme.base,
  background: theme.input.background,
  color: theme.input.color,
  border: `1px solid ${theme.input.border}`,
  borderRadius: theme.input.borderRadius,
  fontFamily: "inherit",
  fontSize: theme.typography.size.s1,
  lineHeight: "18px",
  padding: "2px 4px",

  "&:disabled": {
    cursor: "not-allowed",
    opacity: 0.6,
  },
}));
