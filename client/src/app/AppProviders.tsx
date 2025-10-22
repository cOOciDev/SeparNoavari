import type { ReactNode } from "react";
import I18nProvider from "./providers/I18nProvider";
import AntThemeProvider from "./providers/AntThemeProvider";
import QueryProvider from "./providers/QueryProvider";
import { AuthProvider } from "../contexts/AuthProvider";

type AppProvidersProps = {
  children: ReactNode;
};

const AppProviders = ({ children }: AppProvidersProps) => (
  <I18nProvider>
    <AntThemeProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </AntThemeProvider>
  </I18nProvider>
);

export default AppProviders;
