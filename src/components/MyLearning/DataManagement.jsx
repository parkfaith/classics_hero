import { useState } from 'react';
import { useDataManager } from '../../hooks/useDataManager';

const DataManagement = () => {
  const { exportData, importData, validateBackup, resetAllData, getStorageUsage, hasData } = useDataManager();
  const [importStatus, setImportStatus] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFinal, setShowResetFinal] = useState(false);

  const storageUsage = getStorageUsage();

  // 내보내기
  const handleExport = () => {
    exportData();
    setImportStatus({ type: 'success', message: '데이터가 다운로드되었습니다.' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  // 가져오기
  const handleImport = async (e, mode) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await importData(file, mode);
      setImportStatus({
        type: 'success',
        message: `데이터를 ${mode === 'overwrite' ? '덮어쓰기' : '병합'}로 가져왔습니다. 페이지를 새로고침합니다.`
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setImportStatus({ type: 'error', message: err.message });
    }

    // input 초기화
    e.target.value = '';
  };

  // 초기화
  const handleReset = () => {
    resetAllData();
    setShowResetFinal(false);
    setShowResetConfirm(false);
    setImportStatus({ type: 'success', message: '모든 데이터가 초기화되었습니다. 페이지를 새로고침합니다.' });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="data-management">
      <h2>데이터 관리</h2>

      {/* 저장소 사용량 */}
      <div className="data-section">
        <h3>저장소 사용량</h3>
        <div className="storage-info">
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{ width: `${Math.min(storageUsage.usagePercent, 100)}%` }}
            />
          </div>
          <span className="storage-text">
            {storageUsage.totalKB}KB 사용 중 (예상 한도: {storageUsage.estimatedLimit})
          </span>
        </div>
      </div>

      {/* 내보내기 */}
      <div className="data-section">
        <h3>데이터 내보내기</h3>
        <p className="data-desc">모든 학습 데이터를 JSON 파일로 다운로드합니다.</p>
        <button className="data-btn export-btn" onClick={handleExport} disabled={!hasData()}>
          📥 JSON 다운로드
        </button>
      </div>

      {/* 가져오기 */}
      <div className="data-section">
        <h3>데이터 가져오기</h3>
        <p className="data-desc">백업한 JSON 파일을 불러옵니다.</p>
        <div className="import-options">
          <label className="data-btn import-btn">
            📤 덮어쓰기로 가져오기
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleImport(e, 'overwrite')}
              hidden
            />
          </label>
          <label className="data-btn import-btn merge">
            🔀 병합으로 가져오기
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleImport(e, 'merge')}
              hidden
            />
          </label>
        </div>
        <p className="import-hint">덮어쓰기: 기존 데이터를 완전 대체 / 병합: 더 높은 값 유지</p>
      </div>

      {/* 초기화 */}
      <div className="data-section danger">
        <h3>데이터 초기화</h3>
        <p className="data-desc">모든 학습 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
        {!showResetConfirm ? (
          <button
            className="data-btn reset-btn"
            onClick={() => setShowResetConfirm(true)}
            disabled={!hasData()}
          >
            🗑️ 전체 초기화
          </button>
        ) : !showResetFinal ? (
          <div className="reset-confirm">
            <p className="reset-warning">정말 모든 학습 데이터를 삭제하시겠습니까?</p>
            <div className="reset-actions">
              <button className="data-btn reset-btn" onClick={() => setShowResetFinal(true)}>
                예, 삭제합니다
              </button>
              <button className="data-btn cancel-btn" onClick={() => setShowResetConfirm(false)}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="reset-confirm">
            <p className="reset-warning final">
              백업하지 않으면 복구할 수 없습니다. 정말 진행하시겠습니까?
            </p>
            <div className="reset-actions">
              <button className="data-btn reset-btn final" onClick={handleReset}>
                최종 확인 - 삭제
              </button>
              <button className="data-btn cancel-btn" onClick={() => { setShowResetFinal(false); setShowResetConfirm(false); }}>
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상태 메시지 */}
      {importStatus && (
        <div className={`import-status ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}
    </div>
  );
};

export default DataManagement;
