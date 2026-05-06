import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import AppContainer from './router';
import theme from './shared/antd/themeConfig';
import { validateMessages } from './shared/antd/validateMessages';
import { queryClient } from './shared/react-query/queryClient';
import { ReduxProvider } from './shared/redux/provider';

dayjs.locale('vi');

function App() {
  return (
    <ReduxProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={theme} locale={viVN} form={{ validateMessages }}>
          <AppContainer />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ConfigProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

export default App;
