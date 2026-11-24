'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';

import { useToast } from '@/hooks/useToast';
import { aggregateSubProjectFinancials } from '@/models/project';
import {
  fetchMainProjectDetails, fetchSubProjectsSummary, selectMainDetailsLoading, selectMainProjectDetails, selectSubProjects,
  selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import {
  clearInvoiceableBOQItems, fetchInvoiceableBOQItems, selectInvoiceableBOQItems, selectInvoiceableBOQItemsLoading,
} from '@/store/slices/invoicesSlice';

/**
 * @param {string} projectCode
 */
export function useInvoiceSources(projectCode) {
  const router = useRouter();
  const t = useTranslations('invoices.form');
  const dispatch = useDispatch();
  const toast = useToast();

  const project = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const subProjects = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const boqItems = useSelector(selectInvoiceableBOQItems);
  const boqItemsLoading = useSelector(selectInvoiceableBOQItemsLoading);
  const [redirecting, setRedirecting] = useState(false);

  const projectFinancials = aggregateSubProjectFinancials(subProjects);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
  }, [dispatch, projectCode]);

  useEffect(() => {
    dispatch(fetchInvoiceableBOQItems(projectCode))
      .unwrap()
      .then((items) => {
        if (items.length === 0) {
          toast.warning(
            t('noBoqTitle'),
            t('noBoqBody')
          );
          setRedirecting(true);
        }
      })
      .catch(() => {});
  }, [dispatch, projectCode]);

  useEffect(() => {
    if (!redirecting) return;
    const timer = setTimeout(() => router.back(), 10000);
    return () => clearTimeout(timer);
  }, [redirecting, router]);

  useEffect(() => {
    return () => { dispatch(clearInvoiceableBOQItems()); };
  }, [dispatch]);

  return { project, projectLoading, subProjects, subProjectsLoading, projectFinancials, boqItems, boqItemsLoading };
}
