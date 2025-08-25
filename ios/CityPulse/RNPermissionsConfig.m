#import "RNPermissions.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTLog.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>
#else
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>
#endif

// Import permission handlers
#import "../node_modules/react-native-permissions/ios/Camera/RNPermissionHandlerCamera.h"
#import "../node_modules/react-native-permissions/ios/PhotoLibrary/RNPermissionHandlerPhotoLibrary.h"
#import "../node_modules/react-native-permissions/ios/FaceID/RNPermissionHandlerFaceID.h"

@implementation RNPermissions

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary<NSString *, id> *)constantsToExport {
  NSMutableDictionary<NSString *, id> *constants = [NSMutableDictionary new];
  
  constants[@"CAMERA"] = @"ios.permission.CAMERA";
  constants[@"PHOTO_LIBRARY"] = @"ios.permission.PHOTO_LIBRARY";
  constants[@"FACE_ID"] = @"ios.permission.FACE_ID";
  
  return constants;
}

- (NSArray<RNPermissionHandler *> *)handlers {
  return @[
    [RNPermissionHandlerCamera new],
    [RNPermissionHandlerPhotoLibrary new],
    [RNPermissionHandlerFaceID new],
  ];
}

@end
