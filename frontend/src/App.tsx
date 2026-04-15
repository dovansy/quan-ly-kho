import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import AppContainer from './router';
import theme from './shared/antd/themeConfig';
import { queryClient } from './shared/react-query/queryClient';
import { ReduxProvider } from './shared/redux/provider';

dayjs.locale('ja');

function App() {
  return (
    <ReduxProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme}>
          <AppContainer />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ConfigProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

export default App;
