import { buildLazycatDriveFavoriteKey, LazycatDrivePanel, type LazycatDriveSelection } from '../../../features/lazycat-drive';
import { DEFAULT_HOME_MODULES } from '../homeModules';
import type { HomeModuleKey } from '../types';
import type { FavoriteItemRecord } from '../../../../../shared/favorite';
import type { LazycatDriveEntry, LazycatDriveScope } from '../../../../../shared/drive';

type HomeDrivePanelProps = {
  enabledModules: Record<HomeModuleKey, boolean>;
  favoriteItems: FavoriteItemRecord[];
  driveJumpTarget: { scope: LazycatDriveScope; path: string; nonce: number } | null;
  onFileSelected: (selection: LazycatDriveSelection) => void;
  onAddFavorite: (entry: LazycatDriveEntry, fileUrl: string) => void | Promise<void>;
  onRemoveFavorite: (id: string) => void;
  onRestoreDefaultModules: () => void;
};

export function HomeDrivePanel({
  enabledModules,
  favoriteItems,
  driveJumpTarget,
  onFileSelected,
  onAddFavorite,
  onRemoveFavorite,
  onRestoreDefaultModules
}: HomeDrivePanelProps) {
  const shouldShowDrive = enabledModules.drive;
  const enabledCount = Number(shouldShowDrive);

  return (
    <section className="home-content" aria-label="首页模块">
      {shouldShowDrive ? (
        <section className="home-main-panel">
          <LazycatDrivePanel
            onFileSelected={onFileSelected}
            favoriteKeys={new Set(favoriteItems.map((item) => buildLazycatDriveFavoriteKey(item)))}
            favoriteIdByKey={new Map(favoriteItems.map((item) => [buildLazycatDriveFavoriteKey(item), item.id]))}
            onAddFavorite={onAddFavorite}
            onRemoveFavorite={onRemoveFavorite}
            jumpTarget={driveJumpTarget}
          />
        </section>
      ) : null}
      {enabledCount === 0 ? (
        <section className="panel home-empty-panel">
          <h2>首页暂无模块</h2>
          <p>当前首页模块已全部隐藏，可以恢复默认模块。</p>
          <button className="settings-primary-button" type="button" onClick={onRestoreDefaultModules}>恢复默认</button>
        </section>
      ) : null}
    </section>
  );
}

export { DEFAULT_HOME_MODULES };
