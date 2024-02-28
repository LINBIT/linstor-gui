import styled from '@emotion/styled';

export const Container = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: 20px;
`;

export const LabelText = styled.span`
  width: 220px;
  font-weight: 600;
  margin-right: 10px;
`;

export const TagContainer = styled.div`
  line-height: 2;
`;

export const EmptyDashboard = styled.div`
  height: 300px;
  width: 300px;
  border: dashed 1px gray;
  margin: 0 auto;
  border-radius: 4px;
  line-height: 300px;
  text-align: center;
  cursor: pointer;
  color: gray;
  font-size: 1.4rem;
`;

export const DashboardContainer = styled.div`
  padding: 10px;
`;
