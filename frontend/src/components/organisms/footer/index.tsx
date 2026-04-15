import { Layout } from 'antd';

const { Footer } = Layout;

const CustomFooter = () => {
  return (
    <Footer id="footer">
      <div className="left">
        <span>Copyright © 2023 All rights reserved</span>
      </div>
      <div className="right">
        <a href="">Terms and conditions</a>
        <a href="">Privacy Policy</a>
      </div>
    </Footer>
  );
};

export default CustomFooter;
