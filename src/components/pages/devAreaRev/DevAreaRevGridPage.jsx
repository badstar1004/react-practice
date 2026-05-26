/**
 * DevAreaRevGridPage.jsx
 *
 * devAreaCd 탭별 최종 Rev 조회 + 상세보기 팝업
 * 조회 후 중첩/평면 데이터를 펼쳐 그리드를 동적으로 구성하고,
 * ownerCd·usageCd 등 상위 컬럼은 rowSpan으로 세로 병합
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";

import {
  DEV_AREA_REV_MGMT,
  fetchDevAreaListRequest,
  fetchDevAreaRevListRequest,
} from "store/devAreaRev/devAreaRevAction";
import {
  COMMON_CODE_MGMT,
  fetchCommonCodeRequest,
} from "store/commonCode/commonCodeAction";

import Header from "components/common/Header";
import PageNotice from "components/common/PageNotice";
import Modal from "components/common/Modal";
import Form from "components/common/Form";
import Row from "components/common/Row";
import Col from "components/common/Col";
import FormItem from "components/common/FormItem";
import { AG_GRID_DEFAULT_COL_DEF } from "utils/devAreaRev";
import {
  buildDevAreaRevDetailColumnDefs,
  buildDevAreaRevGridModel,
  DEV_AREA_REV_MERGE_FIELDS,
} from "utils/devAreaRevGrid";
import { normalizeCodeOptions } from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";

import "./DevAreaRevGridPage.css";

const MERGED_GRID_OPTIONS = {
  suppressRowTransform: true,
};

const MERGED_GRID_DEFAULT_COL_DEF = {
  ...AG_GRID_DEFAULT_COL_DEF,
  sortable: false,
  filter: false,
};

const DetailButtonRenderer = forwardRef(function DetailButtonRenderer(props, ref) {
  useImperativeHandle(ref, () => ({
    refresh() {
      return true;
    },
  }));

  return (
    <div className="grid-detail-cell">
      <button
        type="button"
        className="grid-detail-btn"
        onClick={(event) => {
          event.stopPropagation();
          if (props.onDetailClick && props.data) {
            props.onDetailClick(props.data);
          }
        }}
      >
        {props.detailLabel}
      </button>
    </div>
  );
});

const DevAreaRevGridPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const devAreaRevState = useSelector((state) => {
    return state.get(DEV_AREA_REV_MGMT) || {};
  });

  const commonCodeState = useSelector((state) => {
    return state.get(COMMON_CODE_MGMT) || {};
  });

  const devAreaList = devAreaRevState.devAreaList || [];
  const revList = devAreaRevState.revList || [];
  const listLoading =
    devAreaRevState.devAreaListLoading || devAreaRevState.listLoading;
  const apiError = devAreaRevState.error || commonCodeState.error || null;

  const [activeDevAreaCd, setActiveDevAreaCd] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [notice, setNotice] = useState(null);

  const usageOptions = normalizeCodeOptions(commonCodeState.usageCodeList);
  const finalRevDisplay =
    revList.length > 0 && revList[0].finalRev !== undefined
      ? String(revList[0].finalRev)
      : "";

  const handleDetailClick = useCallback((row) => {
    setDetailRow(row);
  }, []);

  const gridModel = useMemo(() => {
    return buildDevAreaRevGridModel({
      revList,
      mergeFields: DEV_AREA_REV_MERGE_FIELDS,
      t,
      i18nKeys: I18N_KEYS,
      usageOptions,
      onDetailClick: handleDetailClick,
      detailLabel: t(I18N_KEYS.VIEW_DETAIL, "상세보기"),
      DetailButtonRenderer,
    });
  }, [revList, t, usageOptions, handleDetailClick]);

  const { rowData, columnDefs } = gridModel;

  const detailColumnDefs = useMemo(() => {
    return buildDevAreaRevDetailColumnDefs({
      t,
      i18nKeys: I18N_KEYS,
      usageOptions,
      DetailButtonRenderer,
    });
  }, [t, usageOptions]);

  useEffect(() => {
    dispatch(fetchDevAreaListRequest());
    dispatch(fetchCommonCodeRequest({ groupCodes: ["USAGE_CD"] }));
  }, [dispatch]);

  useEffect(() => {
    if (devAreaList.length > 0 && !activeDevAreaCd) {
      setActiveDevAreaCd(devAreaList[0].devAreaCd);
    }
  }, [devAreaList, activeDevAreaCd]);

  useEffect(() => {
    if (activeDevAreaCd) {
      dispatch(fetchDevAreaRevListRequest({ devAreaCd: activeDevAreaCd }));
    }
  }, [activeDevAreaCd, dispatch]);

  function handleTabChange(devAreaCd) {
    if (devAreaCd !== activeDevAreaCd) {
      setActiveDevAreaCd(devAreaCd);
    }
  }

  function handleSearch() {
    if (activeDevAreaCd) {
      dispatch(fetchDevAreaRevListRequest({ devAreaCd: activeDevAreaCd }));
    }
  }

  function handleReset() {
    if (devAreaList.length > 0) {
      setActiveDevAreaCd(devAreaList[0].devAreaCd);
    }
  }

  function handleCloseDetail() {
    setDetailRow(null);
  }

  return (
    <div className="page dev-area-rev-page">
      <div className="dev-area-tabs">
        {devAreaList.map((item) => (
          <button
            key={item.devAreaCd}
            type="button"
            className={
              item.devAreaCd === activeDevAreaCd
                ? "dev-area-tabs__button is-active"
                : "dev-area-tabs__button"
            }
            disabled={listLoading}
            onClick={() => handleTabChange(item.devAreaCd)}
          >
            {item.devAreaName || item.devAreaCd}
          </button>
        ))}
      </div>

      <section className="issue-search-box">
        <div className="issue-search-box__title">
          {t(I18N_KEYS.SEARCH_CONDITION, "조회조건")}
        </div>

        <Form
          values={{ finalRev: finalRevDisplay }}
          onSubmit={handleSearch}
          disabled={listLoading || !activeDevAreaCd}
        >
          <Row>
            <Col span={6}>
              <FormItem
                label={t(I18N_KEYS.FINAL_REV_READONLY, "최종 Rev (조회)")}
                name="finalRev"
              >
                <input
                  type="text"
                  readOnly
                  className="search-field__control search-field__control--readonly"
                />
              </FormItem>
            </Col>

            <Col span={18}>
              <div className="issue-search-box__buttons">
                <button
                  type="button"
                  className="btn btn-gray"
                  disabled={listLoading}
                  onClick={handleReset}
                >
                  {t(I18N_KEYS.RESET, "초기화")}
                </button>
                <button
                  type="submit"
                  className="btn btn-blue"
                  disabled={listLoading}
                >
                  {t(I18N_KEYS.SEARCH, "검색")}
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </section>

      <PageNotice notice={notice} onDismiss={() => setNotice(null)} />

      {apiError && (
        <div className="error-box">
          {apiError.message || t(I18N_KEYS.UNKNOWN_ERROR, "알 수 없는 에러")}
        </div>
      )}

      <Header title={t(I18N_KEYS.REV_GRID_TITLE, "Rev 목록")} count={rowData.length}>
        <div className="ag-theme-balham dev-area-rev-grid">
          <AgGridReact
            key={`rev-grid-${activeDevAreaCd}-${rowData.length}`}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={MERGED_GRID_DEFAULT_COL_DEF}
            gridOptions={MERGED_GRID_OPTIONS}
            headerHeight={36}
            groupHeaderHeight={36}
            getRowNodeId={(params) => {
              const data = params.data || {};
              return [
                data.ownerCd,
                data.usageCd,
                data.finalRev,
                data.revStatus,
                data.createDt,
              ]
                .filter((value) => value !== undefined && value !== null)
                .join("_");
            }}
          />
        </div>
      </Header>

      <Modal
        open={Boolean(detailRow)}
        wide
        bodyClassName="modal-panel__body--grid"
        title={t(I18N_KEYS.DETAIL_TITLE, "상세 보기")}
        onClose={handleCloseDetail}
      >
        <div className="ag-theme-balham dev-area-rev-detail-grid">
          <AgGridReact
            rowData={detailRow ? [detailRow] : []}
            columnDefs={detailColumnDefs}
            defaultColDef={AG_GRID_DEFAULT_COL_DEF}
            headerHeight={36}
            groupHeaderHeight={36}
            domLayout="autoHeight"
          />
        </div>
      </Modal>
    </div>
  );
};

export default DevAreaRevGridPage;
