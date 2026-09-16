import React from 'react';
import logo from '@/assets/logo.webp';



/**
 * 侧边栏顶部品牌区：Logo + 站点名。
 * 桌面侧栏与移动端抽屉共用，保证两处品牌呈现一致。
 */
export const SidebarBrand: React.FC = () => (
  <div
    className={`flex flex-col shrink-0 items-center py-2 bg-white`}
  >
    <img
      src={logo}
      alt="吴文龙的互联空间"
      width={84}
      className="shrink-0 rounded-md object-contain"
    />
   
  </div>
);

export default SidebarBrand;
