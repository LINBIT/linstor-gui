import React, { useState, useEffect } from 'react';
import { logManager, LogItem } from '@app/utils/toast'; // Adjust to the correct import path
import { Drawer, Button, List, Badge, Space, Popconfirm } from 'antd'; // Import Popconfirm
import { FileTextOutlined } from '@ant-design/icons';

const LogSidebar: React.FC = () => {
  const [visible, setVisible] = useState(false); // Controls the visibility of the Drawer
  const [logs, setLogs] = useState<LogItem[]>([]); // Stores the logs fetched from sessionStorage
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null); // Stores the currently selected log
  const [unreadCount, setUnreadCount] = useState(0); // Unread logs count

  // Fetch logs from sessionStorage and set the unread count
  const fetchLogs = () => {
    const storedLogs = logManager.getLogs(); // Fetch the logs using the public method
    setLogs(storedLogs);

    // Set unread count for the badge
    const unreadLogs = storedLogs.filter((log) => !log.read);
    setUnreadCount(unreadLogs.length);
  };

  useEffect(() => {
    // Fetch logs on component mount
    fetchLogs();

    // Set up a listener for the custom storage update event
    const handleStorageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent; // Type assertion for custom event
      if (customEvent.detail.key === 'global_api_log') {
        fetchLogs();
      }
    };

    window.addEventListener('storageUpdate', handleStorageUpdate);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('storageUpdate', handleStorageUpdate);
    };
  }, []);

  // Open the Drawer and show the list of logs
  const showDrawer = () => {
    setVisible(true);
  };

  // Close the Drawer
  const onClose = () => {
    setVisible(false);
  };

  // Handle clicking on a log to show its details
  const onLogClick = (log: LogItem) => {
    setSelectedLog(log);
  };

  // Mark a log as read and refresh the logs
  const markLogAsRead = (logKey: string) => {
    logManager.markAsRead(logKey); // Mark the log as read in session storage
    fetchLogs(); // Re-fetch the logs to refresh the state and UI
    setSelectedLog(null); // Optionally deselect the log after marking as read
  };

  // Mark all logs as read
  const markAllAsRead = () => {
    logManager.markAllAsRead(); // Assuming the logManager has a method to mark all logs as read
    fetchLogs(); // Refresh the log list and unread count
    setSelectedLog(null); // Clear any selected log
  };

  // Clear all logs
  const clearAllLogs = () => {
    logManager.clearLogs(); // Assuming logManager has a method to clear all logs
    fetchLogs(); // Refresh the log list and unread count
    setSelectedLog(null); // Clear any selected log
  };

  return (
    <>
      {/* Icon with a red dot badge */}
      <Badge count={unreadCount}>
        <FileTextOutlined
          style={{ fontSize: '20px', cursor: 'pointer', color: 'white', marginTop: 4 }}
          onClick={showDrawer}
        />
      </Badge>

      {/* Drawer for logs */}
      <Drawer
        title={selectedLog ? 'Log Details' : 'Logs'}
        placement="right"
        closable={true}
        onClose={onClose}
        open={visible}
        width={400}
      >
        {/* If no log is selected, show the list of logs */}
        {!selectedLog ? (
          <>
            <List
              itemLayout="horizontal"
              dataSource={logs}
              renderItem={(log) => (
                <List.Item onClick={() => onLogClick(log)} style={{ cursor: 'pointer' }}>
                  <List.Item.Meta title={log.url} description={new Date(log.timestamp).toLocaleString()} />
                  {!log.read && <Badge dot />}
                </List.Item>
              )}
            />
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Space>
                <Button type="primary" onClick={markAllAsRead}>
                  Mark All as Read
                </Button>

                {/* Popconfirm for clearing all logs */}
                <Popconfirm
                  title="Are you sure you want to clear all logs?"
                  onConfirm={clearAllLogs}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="default" danger>
                    Clear All Logs
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </>
        ) : (
          <>
            <p>
              <strong>URL:</strong> {selectedLog.url}
            </p>
            <p>
              <strong>Timestamp:</strong>{' '}
              {new Date(selectedLog?.result?.created_at || selectedLog.timestamp).toLocaleString()}
            </p>

            <p>
              <strong>Message:</strong> {selectedLog.result.message}
            </p>

            {selectedLog.result?.cause && (
              <p>
                <strong>Cause:</strong> {selectedLog.result.cause}
              </p>
            )}

            {selectedLog.result?.details && (
              <p>
                <strong>Details:</strong> {selectedLog.result.details}
              </p>
            )}

            <Space
              style={{
                marginTop: 10,
              }}
            >
              <Button onClick={() => markLogAsRead(selectedLog.key)}>Mark as Read</Button>
              <Button onClick={() => setSelectedLog(null)}>Back to Logs</Button>
            </Space>
          </>
        )}
      </Drawer>
    </>
  );
};

export default LogSidebar;
