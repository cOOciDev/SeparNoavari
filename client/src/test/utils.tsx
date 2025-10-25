import { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import QueryProvider from "../app/providers/QueryProvider";
import I18nProvider from "../app/providers/I18nProvider";
import AntThemeProvider from "../app/providers/AntThemeProvider";
import i18n from "../AppData/i18n";

export const renderWithProviders = (
  ui: ReactElement,
  options?: {
    router?: MemoryRouterProps;
    wrapper?: (children: ReactNode) => ReactNode;
  }
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    void i18n.changeLanguage("en");
    const content = (
      <MemoryRouter {...options?.router}>
        <I18nProvider>
          <QueryProvider>
            <AntThemeProvider>{children}</AntThemeProvider>
          </QueryProvider>
        </I18nProvider>
      </MemoryRouter>
    );

    return <>{options?.wrapper ? options.wrapper(content) : content}</>;
  };

  return render(ui, { wrapper: Wrapper });
};
