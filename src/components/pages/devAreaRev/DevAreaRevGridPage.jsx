/**
 * DevAreaRevGridPage.jsx
 *
 * devAreaCd 탭별 최종 Rev 조회 + 상세보기 팝업
 */

import React, {
  forwardRef,
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
import {
  AG_GRID_DEFAULT_COL_DEF,
  cloneRows,
  findUsageCodeName,
} from "utils/devAreaRev";
import { normalizeCodeOptions } from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";

import "./DevAreaRevGridPage.css";

/** 상세보기 버튼 셀 */
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
  const [rowData, setRowData] = useState([]);
  const [detailRow, setDetailRow] = useState(null);
  const [notice, setNotice] = useState(null);

  const usageOptions = normalizeCodeOptions(commonCodeState.usageCodeList);
  // revList는 최종 Rev만 포함 → 첫 행의 finalRev가 조회조건 표시값
  const finalRevDisplay =
    revList.length > 0 && revList[0].finalRev !== undefined
      ? String(revList[0].finalRev)
      : "";

  // 최초: 탭 목록 + 용도 공통코드
  useEffect(() => {
    dispatch(fetchDevAreaListRequest());
    dispatch(fetchCommonCodeRequest({ groupCodes: ["USAGE_CD"] }));
  }, [dispatch]);

  // 탭 목록 로드 → 첫 탭 선택
  useEffect(() => {
    if (devAreaList.length > 0 && !activeDevAreaCd) {
      setActiveDevAreaCd(devAreaList[0].devAreaCd);
    }
  }, [devAreaList, activeDevAreaCd]);

  // 탭 변경 → Rev 목록 조회 (최종 Rev 필터는 saga에서 처리)
  useEffect(() => {
    if (activeDevAreaCd) {
      dispatch(fetchDevAreaRevListRequest({ devAreaCd: activeDevAreaCd }));
    }
  }, [activeDevAreaCd, dispatch]);

  // Redux revList → 그리드 rowData
  useEffect(() => {
    setRowData(cloneRows(revList));
  }, [revList]);

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

  function handleDetailClick(row) {
    setDetailRow(row);
  }

  function handleCloseDetail() {
    setDetailRow(null);
  }

  /**
   * 2단 헤더 공통 컬럼
   * children 배열이 있으면 ag-Grid가 1행(그룹명) + 2행(컬럼명)으로 표시
   */
  const groupColumnDefs = useMemo(() => {
    return [
      {
        headerName: t(I18N_KEYS.OWNER_INFO, "Owner 정보"),
        marryChildren: true,
        children: [
          {
            headerName: t(I18N_KEYS.OWNER_CODE, "owner code"),
            field: "ownerCd",
            width: 120,
          },
          {
            headerName: t(I18N_KEYS.USAGE, "용도"),
            field: "usageCd",
            width: 100,
            valueFormatter: (params) => {
              return findUsageCodeName(usageOptions, params.value);
            },
          },
        ],
      },
      {
        headerName: t(I18N_KEYS.REV_INFO, "Rev 정보"),
        marryChildren: true,
        children: [
          {
            headerName: t(I18N_KEYS.FINAL_REV, "최종 Rev"),
            field: "finalRev",
            width: 88,
          },
          {
            headerName: t(I18N_KEYS.REV_STATUS, "Rev 상태"),
            field: "revStatus",
            width: 100,
          },
          {
            headerName: t(I18N_KEYS.REV_DESC, "Rev 설명"),
            field: "revDesc",
            minWidth: 160,
            flex: 1,
          },
        ],
      },
      {
        headerName: t(I18N_KEYS.REG_INFO, "등록 정보"),
        marryChildren: true,
        children: [
          {
            headerName: t(I18N_KEYS.CREATE_USER, "등록자"),
            field: "createUser",
            width: 100,
          },
          {
            headerName: t(I18N_KEYS.CREATE_DT, "등록일시"),
            field: "createDt",
            width: 140,
          },
        ],
      },
      {
        headerName: t(I18N_KEYS.MOD_INFO, "수정 정보"),
        marryChildren: true,
        children: [
          {
            headerName: t(I18N_KEYS.UPDATE_USER, "수정자"),
            field: "updateUser",
            width: 100,
          },
          {
            headerName: t(I18N_KEYS.UPDATE_DT, "수정일시"),
            field: "updateDt",
            width: 140,
          },
        ],
      },
    ];
  }, [t, usageOptions]);

  // 목록 그리드: No + 공통 컬럼 + 상세보기
  const columnDefs = useMemo(() => {
    return [
      {
        headerName: t(I18N_KEYS.ROW_NO, "No"),
        width: 64,
        pinned: "left",
        valueGetter: (params) => params.node.rowIndex + 1,
      },
      ...groupColumnDefs,
      {
        headerName: t(I18N_KEYS.VIEW_DETAIL, "상세보기"),
        width: 100,
        pinned: "right",
        sortable: false,
        filter: false,
        cellRendererFramework: DetailButtonRenderer,
        cellRendererParams: {
          detailLabel: t(I18N_KEYS.VIEW_DETAIL, "상세보기"),
          onDetailClick: handleDetailClick,
        },
      },
    ];
  }, [t, groupColumnDefs]);

  return (
    <div className="page dev-area-rev-page">
      {/* devAreaCd 탭 */}
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

      {/* 조회조건 */}
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

      {/* Rev 목록 그리드 */}
      <Header title={t(I18N_KEYS.REV_GRID_TITLE, "Rev 목록")} count={rowData.length}>
        <div className="ag-theme-balham dev-area-rev-grid">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={AG_GRID_DEFAULT_COL_DEF}
            headerHeight={36}
            groupHeaderHeight={36}
          />
        </div>
      </Header>

      {/* 상세보기 팝업 — 클릭한 행을 그대로 1건 표시 (별도 API 없음) */}
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
            columnDefs={groupColumnDefs}
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
