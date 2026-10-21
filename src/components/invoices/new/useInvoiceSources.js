'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import { useToast } from '@/hooks/useToast';
import { aggregateSubProjectFinancials } from '@/models/project';
import {
  fetchMainProjectDetails, fetchSubProjectsSummary, selectMainDetailsLoading, selectMainProjectDetails, selectSubProjects,
} from '@/store/slices/projectsSlice';
import {
  clearInvoiceableBOQItems, fetchInvoiceableBOQItems, selectInvoiceableBOQItems, selectInvoiceableBOQItemsLoading,
} from '@/store/slices/invoicesSlice';

/**
 * What a new invoice request is made from: the project, its financials, and
 * the BOQ items that can still be invoiced. A project with none sends the
 * person back after a short warning — there is nothing to request.
 *
 * @param {string} projectCode
 */
export function useInvoiceSources(projectCode) {
  const router = useRouter();
  const dispatch = useDispatch();
  const toast = useToast();

  const project = useSelector(selectMainProjectDetails);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const subProjects = useSelector(selectSubProjects);
  const boqItems = useSelector(selectInvoiceableBOQItems);
  const boqItemsLoading = useSelector(selectInvoiceableBOQItemsLoading);
  const [redirecting, setRedirecting] = useState(false);

  // Same source as the project card's Financial Summary — shown as reference
  // context while filling out an invoice, not fed into the invoice's own
  // Revenue/WIP fields (project-to-date totals aren't this invoice's
  // revenue/WIP contribution).
  const projectFinancials = aggregateSubProjectFinancials(subProjects);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
  }, [dispatch, projectCode]);

  // Checked off the resolved fetch result (not the isLoading selector) so
  // there's no race with isLoading's initial `false` value on first render.
  useEffect(() => {
    dispatch(fetchInvoiceableBOQItems(projectCode))
      .unwrap()
      .then((items) => {
        if (items.length === 0) {
          toast.warning(
            'No invoiceable BOQ items',
            "This project has no invoiceable BOQ items, so an invoice request can't be created. Taking you back in a few seconds."
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

  return { project, projectLoading, projectFinancials, boqItems, boqItemsLoading };
}
